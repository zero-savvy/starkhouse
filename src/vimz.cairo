#[starknet::interface]
trait IImageProver<TContractState> {
    fn prove(ref self: TContractState, width: u16, height: u16, RC: Array<felt252>, GC: Array<felt252>, BC: Array<felt252>);
    fn is_verified_get_owner(self: @TContractState, hash: felt252) -> starknet::ContractAddress;
}

#[starknet::contract]
mod ImageProver {
    use starknet::{ContractAddress, get_caller_address};
    use core::poseidon::PoseidonTrait;
    use core::poseidon::poseidon_hash_span;
    use core::hash::{HashStateTrait};
    use core::traits::{TryInto, Into};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };

    #[storage]
    struct Storage {
        verified_image_hashes: Map<felt252, ContractAddress>,
    }

    #[derive(Drop, Serde, starknet::Event)]
    struct StructImage {
        width: u16,
        height: u16,
        R: Array<u8>,
        G: Array<u8>,
        B: Array<u8>,
    }

    #[external(v0)]
    fn image_hash(self: @ContractState, width: u16, height: u16, R: Array<u8>, G: Array<u8>, B: Array<u8>) -> felt252 {

        let _shift_by32: felt252 = 0x100000000; // 2^32
        let _shift_by256: felt252 = 0x0100; // 2^8
        let mut tmp: felt252 = 0;
        let mut counter: u8 = 0;

        let mut comp_orig: Array<felt252>  = array![];
        for i in 0..height {
            for j in 0..width {
                let mut index: usize = (i * width + j).try_into().unwrap();
                tmp *= _shift_by256;
                let mut tempR: felt252 = (*R[index]).into();
                let mut tempG: felt252 = (*G[index]).into();
                let mut tempB: felt252 = (*B[index]).into();
                tmp += tempR;
                tmp *= _shift_by256;
                tmp += tempG;
                tmp *= _shift_by256;
                tmp += tempB;  
                counter += 1;
                if counter == 10 {
                    comp_orig.append(tmp);
                    tmp = 0;
                    counter = 0;
                }
            };
        };

        let mut hasher_orig = PoseidonTrait::new();   
        let image_hash = hasher_orig.update(poseidon_hash_span(comp_orig.span())).finalize();
        image_hash
    }

    #[external(v0)]
    fn calc_grayscale(self: @ContractState, width: u16, height: u16, R: Array<u8>, G: Array<u8>, B: Array<u8>) -> Array<u8> {

        let orig_image = StructImage {R: R, G: G, B: B, width: width, height: height};

        let _shift_by32: felt252 = 0x100000000; // 2^32
        let _shift_by256: felt252 = 0x0100; // 2^8
        let mut tmp: felt252 = 0;
        
        let mut tran_image: Array<u8>  = array![];
        let mut comp_tran: Array<felt252>  = array![];
        for i in 0..orig_image.height {
            for j in 0..orig_image.width {
                let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
                tmp *= _shift_by256;
                let mut tempR: u32 = (*orig_image.R[index]).into();
                let mut tempG: u32 = (*orig_image.G[index]).into();
                let mut tempB: u32 = (*orig_image.B[index]).into();
                let grayval: u32 = (tempR*299 + tempG*587 + tempB*114) / 1000;
                tran_image.append(grayval.try_into().unwrap());
            };
        };
        tran_image
    }
    #[external(v0)]
    fn image_hash_grayscale(self: @ContractState, width: u16, height: u16, GrayC: Array<felt252>) -> felt252 {

        let lenn: usize = 30;
        let mut Gray: Array<u8> = array![];
        for i in 0..(height*width/30) {
            let mut tmpGray: u256 = (*GrayC[i.into()]).into();
            for _ in 0..lenn {
                Gray.append((tmpGray % 256).try_into().unwrap());
                tmpGray /= 256;
            }
        };


        let _shift_by32: felt252 = 0x100000000; // 2^32
        let _shift_by256: felt252 = 0x0100; // 2^8
        let mut tmp: felt252 = 0;
        let mut counter: u8 = 0;

        // let mut comp_orig: Array<felt252>  = array![];
        // for i in 0..height {
        //     for j in 0..width {
        //         let mut index: usize = (i * width + j).try_into().unwrap();
        //         tmp *= _shift_by256;
        //         let mut tempGray: felt252 = (*Gray[index]).into();
        //         tmp += tempGray;
        //         counter += 1;
        //         if counter == 10 {
        //             comp_orig.append(tmp);
        //             tmp = 0;
        //             counter = 0;
        //         }
        //     };
        // };

        tmp = 0;
        counter = 0;
        let mut comp_tran: Array<felt252>  = array![];
        for i in 0..height {
            for j in 0..width {
                let mut index: usize = (i * width + j).try_into().unwrap();
                tmp *= _shift_by256;
                tmp += (*Gray[index]).into();
                counter += 1;
                if counter == 10 {
                    comp_tran.append(tmp);
                    tmp = 0;
                    counter = 0;
                }
            };
        };
        let mut hasher_tran = PoseidonTrait::new();    
        let tran_image_hash = hasher_tran.update(poseidon_hash_span(comp_tran.span())).finalize();
        tran_image_hash
    }

    #[abi(embed_v0)]
    impl ImageProverImpl of super::IImageProver<ContractState> {
        
        fn prove(ref self: ContractState, width: u16, height: u16, RC: Array<felt252>, GC: Array<felt252>, BC: Array<felt252>) {

            let lenn: usize = 30;
            let mut R: Array<u8> = array![];
            let mut G: Array<u8> = array![];
            let mut B: Array<u8> = array![];
            for i in 0..(height*width/30) {
                let mut tmpR: u256 = (*RC[i.into()]).into();
                let mut tmpG: u256 = (*GC[i.into()]).into();
                let mut tmpB: u256 = (*BC[i.into()]).into();
                for _ in 0..lenn {
                    R.append((tmpR % 256).try_into().unwrap());
                    tmpR /= 256;
                    G.append((tmpG % 256).try_into().unwrap());
                    tmpG /= 256;
                    B.append((tmpB % 256).try_into().unwrap());
                    tmpB /= 256;
                }
            };

            let orig_image = StructImage {R: R, G: G, B: B, width: width, height: height};

            // -------------------------------------
            // compress pixel values
            // -------------------------------------
            // let mut _comp_orig: Array<felt252> = array![];
            let _shift_by32: felt252 = 0x100000000; // 2^32
            let _shift_by256: felt252 = 0x0100; // 2^8
            let mut tmp: felt252 = 0;
            let mut counter: u8 = 0;

            let mut comp_orig: Array<felt252>  = array![];
            for i in 0..orig_image.height {
                for j in 0..orig_image.width {
                    let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
                    tmp *= _shift_by256;
                    let mut tempR: felt252 = (*orig_image.R[index]).into();
                    let mut tempG: felt252 = (*orig_image.G[index]).into();
                    let mut tempB: felt252 = (*orig_image.B[index]).into();
                    tmp += tempR;
                    tmp *= _shift_by256;
                    tmp += tempG;
                    tmp *= _shift_by256;
                    tmp += tempB;  
                    counter += 1;
                    if counter == 10 {
                        comp_orig.append(tmp);
                        tmp = 0;
                        counter = 0;
                    }
                };
            };
            // ------------------------------------
            // Calculate Hash of the ORIGINAL image
            // ------------------------------------
            let mut hasher_orig = PoseidonTrait::new();    
            let orig_image_hash = hasher_orig.update(poseidon_hash_span(comp_orig.span())).finalize();
            //println!("{}", orig_image_hash);

            // Grayscale : 0.299 ∙ Red + 0.587 ∙ Green + 0.114 ∙ Blue
            let mut tran_image: Array<u8>  = array![];
            let mut comp_tran: Array<felt252>  = array![];
            for i in 0..orig_image.height {
                for j in 0..orig_image.width {
                    let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
                    tmp *= _shift_by256;
                    let mut tempR: u32 = (*orig_image.R[index]).into();
                    let mut tempG: u32 = (*orig_image.G[index]).into();
                    let mut tempB: u32 = (*orig_image.B[index]).into();
                    let grayval: u32 = (tempR*299 + tempG*587 + tempB*114) / 1000;
                    tran_image.append(grayval.try_into().unwrap());

                };
            };
            // --------------------------

            // ---------------------------------------
            // Calculate Hash of the TRANSFORMED image
            // ---------------------------------------
            tmp = 0;
            counter = 0;
            for i in 0..orig_image.height {
                for j in 0..orig_image.width {
                    let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
                    tmp *= _shift_by256;
                    tmp += (*tran_image[index]).into();
                    counter += 1;
                    if counter == 10 {
                        comp_tran.append(tmp);
                        tmp = 0;
                        counter = 0;
                    }
                };
            };
            let mut hasher_tran = PoseidonTrait::new();    
            let tran_image_hash = hasher_tran.update(poseidon_hash_span(comp_tran.span())).finalize();

            let caller = get_caller_address();
            self.verified_image_hashes.entry(tran_image_hash).write(caller);
            self.verified_image_hashes.entry(orig_image_hash).write(caller);
            // ---------------------
            // assert transformation
            // ---------------------
        }

        fn is_verified_get_owner(self: @ContractState, hash: felt252) -> ContractAddress {
            self.verified_image_hashes.entry(hash).read()
        }
    }


    // You can add any helper functions here if needed
    // fn process_image(image: StructImage) -> felt252 {
    //     // Implementation
    // }
}