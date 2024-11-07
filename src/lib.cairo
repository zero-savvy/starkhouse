
use core::poseidon::PoseidonTrait;
use core::poseidon::poseidon_hash_span;
use core::hash::{HashStateTrait, HashStateExTrait};
//use core::integer::U8IntoU256;
use core::traits::{TryInto, Into};
// use core::integer::{U8IntoFelt252};

#[derive(Drop, Hash)]
struct StructForHash {
    first: felt252,
    second: felt252,
    third: (u32, u32),
    last: bool,
} 

#[derive(Drop)]
struct StructForHashArray {
    first: felt252,
    second: felt252,
    third: Array<felt252>,
}

#[derive(Drop)]
struct StructImage {
    width: u16,
    height: u16,
    R: Array<u8>,
    G: Array<u8>,
    B: Array<u8>,
}

fn main() -> felt252 {
    let orig_image = StructImage {R: array![1,2,2,2,2,2,2,1,1,1], G: array![1,2,2,2,2,2,2,1,1,1], B: array![1,2,2,2,2,2,2,1,1,1], width: 2, height: 5};

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
    println!("{}", orig_image_hash);
    // ---------------------------------------
    // Calculate Hash of the TRANSFORMED image
    // ---------------------------------------
    // let mut hasher_tran = PoseidonTrait::new();    
    // let tran_image_hash = hasher_tran.update(poseidon_hash_span(orig_image.data.span())).finalize();



    // ---------------------
    // assert transformation
    // ---------------------

    orig_image_hash //+ tran_image_hash
}
